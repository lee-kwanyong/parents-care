'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

type Device = {
  id: string
  familyCode: string
  parentName: string
  guardianName: string
  supplier: string
  model: string
  color: string
  ringSize: string
  serialNumber: string
  sampleType: string
  stage: string
  status: string
  unitCostUsd: number
  accessoryCostUsd: number
  sampleCount: number
  batteryPct: number
  wearMinutesAvg: number
  dataQualityScore: number
  reportCount: number
  guardianViewCount: number
  lastSyncAt: string
  issue: string
  memo: string
  latestReport?: null | {
    status: string
    score: number
    quality: number
    battery: number
    wearMinutes: number
    createdAt: string
  }
}

type Report = {
  id: string
  familyCode: string
  parentName: string
  guardianName: string
  status: string
  score: number
  quality: number
  battery: number
  wearMinutes: number
  createdAt: string
}

type Family = {
  familyCode: string
  parentName: string
  guardianName: string
}

type ModelSpec = {
  model: string
  supplier: string
  samplePriceUsd: number
  unit500Usd: number
  unit1000Usd: number
  material: string
  weight: string
  battery: string
  waterproof: string
  memory: string
  sensors: string[]
  features: string[]
}

type Accessory = {
  item: string
  priceUsd: number
  memo: string
}

type DashboardData = {
  ok: boolean
  message?: string
  stages?: string[]
  devices?: Device[]
  reports?: Report[]
  families?: Family[]
  metrics?: {
    totalDevices: number
    activeDevices: number
    assignedDevices: number
    todayReports: number
    checkNeeded: number
    lowQuality: number
    lowBattery: number
    lowWear: number
    sampleCount: number
    hardwareCostUsd: number
    guardianViews: number
  }
  modelCatalog?: ModelSpec[]
  accessoryCatalog?: Accessory[]
  sourceErrors?: string[]
}

type FormState = {
  familyCode: string
  parentName: string
  guardianName: string
  supplier: string
  model: string
  color: string
  ringSize: string
  serialNumber: string
  sampleType: string
  stage: string
  status: string
  unitCostUsd: string
  accessoryCostUsd: string
  sampleCount: string
  batteryPct: string
  wearMinutesAvg: string
  dataQualityScore: string
  issue: string
  memo: string
}

const initialForm: FormState = {
  familyCode: '',
  parentName: '부모님',
  guardianName: '보호자',
  supplier: 'eIoT',
  model: 'TM22',
  color: 'Silver',
  ringSize: '',
  serialNumber: '',
  sampleType: 'sample',
  stage: '샘플대기',
  status: 'active',
  unitCostUsd: '22',
  accessoryCostUsd: '0.5',
  sampleCount: '1',
  batteryPct: '',
  wearMinutesAvg: '',
  dataQualityScore: '',
  issue: '',
  memo: ''
}

const DEFAULT_STAGES = ['샘플대기', '수령완료', '가구배정', '데이터수집', '리포트검증', '문제확인', '완료']

function localKey() {
  return 'anbu-ring-pilot-local-devices'
}

function readLocalDevices(): Device[] {
  if (typeof window === 'undefined') return []

  try {
    return JSON.parse(window.localStorage.getItem(localKey()) || '[]') as Device[]
  } catch {
    return []
  }
}

function writeLocalDevices(items: Device[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(localKey(), JSON.stringify(items.slice(0, 100)))
}

function makeLocalDevice(form: FormState): Device {
  const now = new Date().toISOString()

  return {
    id: `local-${Date.now()}`,
    familyCode: form.familyCode,
    parentName: form.parentName || '부모님',
    guardianName: form.guardianName || '보호자',
    supplier: form.supplier,
    model: form.model,
    color: form.color,
    ringSize: form.ringSize,
    serialNumber: form.serialNumber,
    sampleType: form.sampleType,
    stage: form.stage,
    status: form.status,
    unitCostUsd: Number(form.unitCostUsd) || 0,
    accessoryCostUsd: Number(form.accessoryCostUsd) || 0,
    sampleCount: Number(form.sampleCount) || 1,
    batteryPct: Number(form.batteryPct) || 0,
    wearMinutesAvg: Number(form.wearMinutesAvg) || 0,
    dataQualityScore: Number(form.dataQualityScore) || 0,
    reportCount: 0,
    guardianViewCount: 0,
    lastSyncAt: '',
    issue: form.issue,
    memo: form.memo,
    latestReport: null
  }
}

function Pill({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${className || 'bg-white text-[#17443F] ring-[#D6EDE7]'}`}>
      {children}
    </span>
  )
}

function stageClass(stage: string) {
  if (stage === '문제확인') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  if (stage === '리포트검증' || stage === '데이터수집') return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (stage === '샘플대기' || stage === '수령완료') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  return 'bg-white text-[#17443F] ring-[#D6EDE7]'
}

function healthClass(device: Device) {
  const report = device.latestReport
  const quality = report?.quality || device.dataQualityScore
  const battery = report?.battery || device.batteryPct
  const wear = report?.wearMinutes || device.wearMinutesAvg

  if (report?.status === 'check_needed' || quality < 45 && quality > 0 || battery < 20 && battery > 0) {
    return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  }

  if ((wear > 0 && wear < 360) || report?.status === 'watch') {
    return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  }

  return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
}

function formatDate(value: string) {
  if (!value) return '기록 없음'

  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return value

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(parsed))
}

function DeviceCard({
  device,
  stages,
  onMove,
  onEdit
}: {
  device: Device
  stages: string[]
  onMove: (id: string, stage: string) => void
  onEdit: (device: Device) => void
}) {
  const latest = device.latestReport

  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#D6EDE7]">
      <div className="flex flex-wrap gap-2">
        <Pill className={stageClass(device.stage)}>{device.stage}</Pill>
        <Pill className={healthClass(device)}>
          {latest?.status || device.status || 'active'}
        </Pill>
        <Pill>{device.supplier}</Pill>
      </div>

      <h3 className="mt-3 text-xl font-black tracking-[-0.05em]">
        {device.model} · {device.color || '색상 미정'}
      </h3>

      <p className="mt-2 text-sm font-bold leading-6 text-[#637B76]">
        {device.familyCode ? `${device.parentName} / ${device.familyCode}` : '가구 미배정'}
      </p>

      <div className="mt-4 grid gap-2 text-xs font-black text-[#17443F]">
        <div className="rounded-xl bg-[#FAFFFD] px-3 py-2 ring-1 ring-[#D6EDE7]">
          사이즈 {device.ringSize || '-'} · 시리얼 {device.serialNumber || '-'}
        </div>

        <div className="rounded-xl bg-[#FAFFFD] px-3 py-2 ring-1 ring-[#D6EDE7]">
          샘플 {device.sampleCount || 1}개 · 원가 ${(device.unitCostUsd + device.accessoryCostUsd).toFixed(1)}
        </div>

        <div className="rounded-xl bg-[#FAFFFD] px-3 py-2 ring-1 ring-[#D6EDE7]">
          품질 {latest?.quality || device.dataQualityScore || 0}점 · 배터리 {latest?.battery || device.batteryPct || 0}% · 착용 {Math.round(((latest?.wearMinutes || device.wearMinutesAvg || 0) / 60) * 10) / 10}시간
        </div>

        <div className="rounded-xl bg-[#FAFFFD] px-3 py-2 ring-1 ring-[#D6EDE7]">
          최근 리포트 {formatDate(latest?.createdAt || device.lastSyncAt)}
        </div>
      </div>

      {device.issue || device.memo ? (
        <p className="mt-3 rounded-xl bg-[#FFF9EE] p-3 text-xs font-bold leading-6 text-[#795C22] ring-1 ring-[#F3DEB5]">
          {device.issue || device.memo}
        </p>
      ) : null}

      <div className="mt-4 grid gap-2">
        <select
          value={device.stage}
          onChange={(event) => onMove(device.id, event.target.value)}
          className="rounded-xl border border-[#D6EDE7] bg-white px-3 py-3 text-xs font-black outline-none"
        >
          {stages.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>

        <button
          onClick={() => onEdit(device)}
          className="rounded-xl bg-[#EFFFFA] px-3 py-3 text-xs font-black text-[#247A71] ring-1 ring-[#CDEFE7]"
        >
          기기 메모/상태 수정
        </button>
      </div>
    </article>
  )
}

export function AdminRingPilotDashboardPanel() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)
  const [localDevices, setLocalDevices] = useState<Device[]>([])
  const [query, setQuery] = useState('')
  const [modelFilter, setModelFilter] = useState('전체')
  const [stageFilter, setStageFilter] = useState('전체')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [editDevice, setEditDevice] = useState<Device | null>(null)

  const stages = data?.stages?.length ? data.stages : DEFAULT_STAGES
  const modelCatalog = data?.modelCatalog || []
  const accessoryCatalog = data?.accessoryCatalog || []
  const sourceErrors = data?.sourceErrors || []

  const devices = useMemo(() => {
    const server = data?.devices || []
    const all = [...localDevices, ...server]
    const seen = new Set<string>()

    return all.filter((device) => {
      const key = device.id || `${device.familyCode}-${device.model}-${device.serialNumber}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [data, localDevices])

  const filteredDevices = useMemo(() => {
    const textQuery = query.trim().toLowerCase()

    return devices.filter((device) => {
      const haystack = [
        device.familyCode,
        device.parentName,
        device.guardianName,
        device.supplier,
        device.model,
        device.color,
        device.ringSize,
        device.serialNumber,
        device.stage,
        device.status,
        device.issue,
        device.memo
      ].join(' ').toLowerCase()

      return (
        (!textQuery || haystack.includes(textQuery)) &&
        (modelFilter === '전체' || device.model === modelFilter) &&
        (stageFilter === '전체' || device.stage === stageFilter)
      )
    })
  }, [devices, query, modelFilter, stageFilter])

  const metrics = useMemo(() => {
    const target = filteredDevices
    const reports = data?.reports || []

    const lowQuality = target.filter((device) => {
      const quality = device.latestReport?.quality || device.dataQualityScore
      return quality > 0 && quality < 45
    }).length

    const lowBattery = target.filter((device) => {
      const battery = device.latestReport?.battery || device.batteryPct
      return battery > 0 && battery < 20
    }).length

    const lowWear = target.filter((device) => {
      const wear = device.latestReport?.wearMinutes || device.wearMinutesAvg
      return wear > 0 && wear < 360
    }).length

    return {
      totalDevices: target.length,
      activeDevices: target.filter((device) => device.status === 'active').length,
      assignedDevices: target.filter((device) => Boolean(device.familyCode)).length,
      todayReports: data?.metrics?.todayReports || 0,
      checkNeeded: data?.metrics?.checkNeeded || 0,
      lowQuality,
      lowBattery,
      lowWear,
      sampleCount: target.reduce((sum, device) => sum + (device.sampleCount || 1), 0),
      hardwareCostUsd: target.reduce((sum, device) => sum + ((device.unitCostUsd + device.accessoryCostUsd) * Math.max(1, device.sampleCount || 1)), 0),
      recentReports: reports.length
    }
  }, [filteredDevices, data])

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value
    }))
  }

  function applyModel(model: string) {
    const spec = modelCatalog.find((item) => item.model === model)

    setForm((prev) => ({
      ...prev,
      model,
      supplier: spec?.supplier || prev.supplier,
      unitCostUsd: spec?.samplePriceUsd ? String(spec.samplePriceUsd) : prev.unitCostUsd
    }))
  }

  function applyFamily(familyCode: string) {
    const family = data?.families?.find((item) => item.familyCode === familyCode)

    setForm((prev) => ({
      ...prev,
      familyCode,
      parentName: family?.parentName || prev.parentName,
      guardianName: family?.guardianName || prev.guardianName
    }))
  }

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin-ring-pilot-dashboard', {
        cache: 'no-store',
        credentials: 'include'
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        setMessage(result.message || '스마트링 실증 대시보드를 불러오지 못했습니다.')
        setData(result)
        return
      }

      setData(result)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '스마트링 실증 대시보드를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function createDevice() {
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin-ring-pilot-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          action: 'create',
          ...form
        })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        setMessage(result.message || '스마트링 기기 저장에 실패했습니다.')
        return
      }

      if (!result.persisted) {
        const next = [result.device || makeLocalDevice(form), ...readLocalDevices()].slice(0, 100)
        writeLocalDevices(next)
        setLocalDevices(next)
      }

      setMessage(result.persisted ? '스마트링 기기를 저장했습니다.' : '서버 저장은 실패했지만 이 기기에 임시 저장했습니다.')
      setForm(initialForm)
      await load()
    } catch (error) {
      const next = [makeLocalDevice(form), ...readLocalDevices()].slice(0, 100)
      writeLocalDevices(next)
      setLocalDevices(next)
      setMessage(error instanceof Error ? error.message : '서버 저장 실패. 이 기기에 임시 저장했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function updateDevice(id: string, patch: Partial<Device>) {
    const localUpdated = localDevices.map((device) => (
      device.id === id
        ? {
            ...device,
            ...patch
          }
        : device
    ))
    setLocalDevices(localUpdated)
    writeLocalDevices(localUpdated)

    try {
      await fetch('/api/admin-ring-pilot-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          action: 'update',
          id,
          ...patch
        })
      })
      await load()
    } catch {
      // 로컬 반영은 이미 완료했습니다.
    }
  }

  async function saveEdit() {
    if (!editDevice) return

    await updateDevice(editDevice.id, {
      stage: editDevice.stage,
      status: editDevice.status,
      issue: editDevice.issue,
      memo: editDevice.memo,
      batteryPct: editDevice.batteryPct,
      wearMinutesAvg: editDevice.wearMinutesAvg,
      dataQualityScore: editDevice.dataQualityScore,
      guardianViewCount: editDevice.guardianViewCount
    })

    setEditDevice(null)
    setMessage('기기 상태와 메모를 업데이트했습니다.')
  }

  async function copySummary() {
    const lines = [
      '[안부웍스] 스마트링 실증 대시보드 요약',
      '',
      `전체 기기: ${metrics.totalDevices}개`,
      `가구 배정: ${metrics.assignedDevices}개`,
      `오늘 리포트: ${metrics.todayReports}건`,
      `확인필요: ${metrics.checkNeeded}건`,
      `데이터 품질 부족: ${metrics.lowQuality}건`,
      `배터리 부족: ${metrics.lowBattery}건`,
      `착용 부족: ${metrics.lowWear}건`,
      `샘플 수량: ${metrics.sampleCount}개`,
      `예상 하드웨어 원가: $${metrics.hardwareCostUsd.toFixed(1)}`,
      '',
      ...filteredDevices.slice(0, 20).map((device) => {
        return `- ${device.model} / ${device.stage} / ${device.familyCode || '미배정'} / 품질 ${device.latestReport?.quality || device.dataQualityScore || 0} / 배터리 ${device.latestReport?.battery || device.batteryPct || 0}%`
      })
    ]

    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setMessage('스마트링 실증 요약을 복사했습니다.')
    } catch {
      setMessage('복사에 실패했습니다. 브라우저 권한을 확인해주세요.')
    }
  }

  useEffect(() => {
    setLocalDevices(readLocalDevices())
    load()
  }, [])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#E7FFF7_0%,#F7FFFC_34%,#FFFFFF_72%)] px-4 py-8 text-[#17443F]">
      <section className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[2.5rem] bg-white/95 shadow-[0_24px_80px_rgba(49,151,136,0.10)] ring-1 ring-[#D6EDE7]">
          <div className="grid gap-0 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="p-6 sm:p-9">
              <div className="flex flex-wrap gap-2">
                <Pill className="bg-[#F6F4FF] text-[#4A3A8A] ring-[#DED8FF]">Smart Ring Pilot</Pill>
                <Pill className="bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]">데이터 품질</Pill>
                <Pill>운영실 전용</Pill>
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.08em] sm:text-6xl">
                스마트링 실증을
                <br />
                모델별로 관리합니다.
              </h1>

              <p className="mt-5 max-w-3xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                샘플, 가구 배정, 착용 시간, 배터리, 데이터 품질, 리포트 생성률을 한 화면에서 확인합니다.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  onClick={load}
                  disabled={loading}
                  className="rounded-2xl bg-[#EFFFFA] px-5 py-4 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7] disabled:opacity-50"
                >
                  {loading ? '새로고침 중' : '새로고침'}
                </button>

                <button
                  onClick={copySummary}
                  className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                >
                  요약 복사
                </button>

                <Link
                  href="/admin/ops/ring-csv-import"
                  className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                >
                  CSV 업로드
                </Link>

                <Link
                  href="/admin/ops/ring-report-lab"
                  className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                >
                  리포트 실험실
                </Link>

                <Link
                  href="/admin/ops"
                  className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                >
                  Admin 운영실
                </Link>
              </div>
            </div>

            <aside className="bg-[linear-gradient(135deg,#F6F4FF_0%,#F7FFFC_50%,#FFFFFF_100%)] p-6 sm:p-9">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/90 p-5 ring-1 ring-[#D6EDE7]">
                  <div className="text-xs font-black text-[#637B76]">전체 기기</div>
                  <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{metrics.totalDevices}</div>
                </div>
                <div className="rounded-2xl bg-white/90 p-5 ring-1 ring-[#D6EDE7]">
                  <div className="text-xs font-black text-[#637B76]">오늘 리포트</div>
                  <div className="mt-2 text-4xl font-black tracking-[-0.08em] text-[#247A71]">{metrics.todayReports}</div>
                </div>
                <div className="rounded-2xl bg-white/90 p-5 ring-1 ring-[#D6EDE7]">
                  <div className="text-xs font-black text-[#637B76]">확인필요</div>
                  <div className="mt-2 text-4xl font-black tracking-[-0.08em] text-[#8A3030]">{metrics.checkNeeded}</div>
                </div>
                <div className="rounded-2xl bg-white/90 p-5 ring-1 ring-[#D6EDE7]">
                  <div className="text-xs font-black text-[#637B76]">예상 원가</div>
                  <div className="mt-2 text-4xl font-black tracking-[-0.08em] text-[#4A3A8A]">${metrics.hardwareCostUsd.toFixed(0)}</div>
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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['가구 배정', `${metrics.assignedDevices}개`, 'family'],
            ['데이터 품질 부족', `${metrics.lowQuality}건`, 'quality'],
            ['배터리 부족', `${metrics.lowBattery}건`, 'battery'],
            ['착용 부족', `${metrics.lowWear}건`, 'wear']
          ].map(([label, value, key]) => (
            <article key={key} className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7]">
              <div className="text-sm font-black text-[#637B76]">{label}</div>
              <div className="mt-3 text-4xl font-black tracking-[-0.08em]">{value}</div>
            </article>
          ))}
        </section>

        <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <Pill className="bg-[#F6F4FF] text-[#4A3A8A] ring-[#DED8FF]">모델 후보</Pill>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">견적 기준 모델 카탈로그</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {modelCatalog.map((spec) => (
              <button
                key={spec.model}
                onClick={() => applyModel(spec.model)}
                className="rounded-2xl bg-[#FAFFFD] p-4 text-left ring-1 ring-[#D6EDE7] transition hover:-translate-y-0.5 hover:bg-white"
              >
                <div className="flex flex-wrap gap-2">
                  <Pill className="bg-white text-[#17443F] ring-[#D6EDE7]">{spec.supplier}</Pill>
                  <Pill className="bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]">${spec.samplePriceUsd || '-'}</Pill>
                </div>
                <div className="mt-3 text-2xl font-black tracking-[-0.06em]">{spec.model}</div>
                <p className="mt-2 text-xs font-bold leading-6 text-[#637B76]">
                  {spec.battery} · {spec.waterproof} · {spec.memory}
                </p>
                <p className="mt-2 text-xs font-bold leading-6 text-[#637B76]">
                  {spec.features.slice(0, 5).join(' · ')}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[2rem] bg-white/95 p-6 shadow-sm ring-1 ring-[#D6EDE7]">
            <Pill className="bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]">기기 추가</Pill>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">새 스마트링 샘플 등록</h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-black text-[#637B76]">가족코드</span>
                <input
                  list="ring-family-codes"
                  value={form.familyCode}
                  onChange={(event) => applyFamily(event.target.value.replace(/[^\w-]/g, '').slice(0, 32))}
                  placeholder="선택 입력"
                  className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                />
                <datalist id="ring-family-codes">
                  {(data?.families || []).map((family) => (
                    <option key={family.familyCode} value={family.familyCode}>
                      {family.parentName} / {family.guardianName}
                    </option>
                  ))}
                </datalist>
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#637B76]">단계</span>
                <select
                  value={form.stage}
                  onChange={(event) => setField('stage', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                >
                  {stages.map((stage) => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#637B76]">부모님 이름</span>
                <input
                  value={form.parentName}
                  onChange={(event) => setField('parentName', event.target.value.slice(0, 30))}
                  className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#637B76]">보호자 이름</span>
                <input
                  value={form.guardianName}
                  onChange={(event) => setField('guardianName', event.target.value.slice(0, 30))}
                  className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#637B76]">공급사</span>
                <input
                  value={form.supplier}
                  onChange={(event) => setField('supplier', event.target.value.slice(0, 40))}
                  className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#637B76]">모델</span>
                <select
                  value={form.model}
                  onChange={(event) => applyModel(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                >
                  {modelCatalog.map((spec) => (
                    <option key={spec.model} value={spec.model}>{spec.model}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#637B76]">색상</span>
                <input
                  value={form.color}
                  onChange={(event) => setField('color', event.target.value.slice(0, 40))}
                  className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#637B76]">사이즈</span>
                <input
                  value={form.ringSize}
                  onChange={(event) => setField('ringSize', event.target.value.slice(0, 10))}
                  placeholder="예: 8#"
                  className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#637B76]">시리얼</span>
                <input
                  value={form.serialNumber}
                  onChange={(event) => setField('serialNumber', event.target.value.slice(0, 80))}
                  className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#637B76]">샘플 수량</span>
                <input
                  value={form.sampleCount}
                  onChange={(event) => setField('sampleCount', event.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                  className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#637B76]">단가 USD</span>
                <input
                  value={form.unitCostUsd}
                  onChange={(event) => setField('unitCostUsd', event.target.value.replace(/[^\d.]/g, '').slice(0, 10))}
                  className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#637B76]">액세서리 USD</span>
                <input
                  value={form.accessoryCostUsd}
                  onChange={(event) => setField('accessoryCostUsd', event.target.value.replace(/[^\d.]/g, '').slice(0, 10))}
                  className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-sm font-black text-[#637B76]">이슈/메모</span>
                <textarea
                  value={form.memo}
                  onChange={(event) => setField('memo', event.target.value.slice(0, 1200))}
                  className="mt-2 min-h-[100px] w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-bold leading-7 outline-none"
                />
              </label>
            </div>

            <button
              onClick={createDevice}
              disabled={saving}
              className="mt-5 w-full rounded-2xl bg-[#EFFFFA] px-5 py-5 text-base font-black text-[#247A71] ring-1 ring-[#CDEFE7] disabled:opacity-50"
            >
              {saving ? '저장 중...' : '스마트링 샘플 등록'}
            </button>
          </article>

          <article className="rounded-[2rem] bg-white/95 p-6 shadow-sm ring-1 ring-[#D6EDE7]">
            <Pill>검색/필터</Pill>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">실증 상태</h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="모델, 가족코드, 부모님, 시리얼 검색"
                className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
              />

              <select
                value={modelFilter}
                onChange={(event) => setModelFilter(event.target.value)}
                className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
              >
                <option value="전체">전체 모델</option>
                {Array.from(new Set(devices.map((device) => device.model))).filter(Boolean).map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>

              <select
                value={stageFilter}
                onChange={(event) => setStageFilter(event.target.value)}
                className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
              >
                <option value="전체">전체 단계</option>
                {stages.map((stage) => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </div>

            <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
              성공 기준은 착용 지속성, 데이터 수집률, 보호자 리포트 조회율, 확인필요 후속처리율입니다. 의료 판단이 아니라 비의료 안부 참고 신호로 관리하세요.
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {accessoryCatalog.map((item) => (
                <div key={item.item} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <div className="text-sm font-black">{item.item}</div>
                  <div className="mt-1 text-xs font-bold leading-6 text-[#637B76]">
                    ${item.priceUsd} · {item.memo}
                  </div>
                </div>
              ))}
            </div>

            {sourceErrors.length ? (
              <details className="mt-5 rounded-2xl bg-white p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
                <summary className="cursor-pointer font-black text-[#795C22]">
                  데이터 연결 확인 필요 {sourceErrors.length}건
                </summary>
                <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-[#FFF9EE] p-3 text-xs text-[#795C22]">
                  {sourceErrors.join('\n\n')}
                </pre>
              </details>
            ) : null}
          </article>
        </section>

        <section className="overflow-x-auto pb-4">
          <div className="grid min-w-[1400px] grid-cols-7 gap-4">
            {stages.map((stage) => {
              const column = filteredDevices.filter((device) => device.stage === stage)

              return (
                <section key={stage} className="rounded-[2rem] bg-white/90 p-4 shadow-sm ring-1 ring-[#D6EDE7]">
                  <div className="sticky top-3 z-10 rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="text-lg font-black tracking-[-0.05em]">{stage}</div>
                    <div className="mt-1 text-xs font-black text-[#637B76]">{column.length}개</div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {column.length ? (
                      column.map((device) => (
                        <DeviceCard
                          key={device.id}
                          device={device}
                          stages={stages}
                          onMove={(id, nextStage) => updateDevice(id, { stage: nextStage })}
                          onEdit={setEditDevice}
                        />
                      ))
                    ) : (
                      <div className="rounded-2xl bg-[#FAFFFD] p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
                        아직 기기가 없습니다.
                      </div>
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white/95 p-6 shadow-sm ring-1 ring-[#D6EDE7]">
          <Pill>최근 스마트링 리포트</Pill>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">최근 리포트 흐름</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(data?.reports || []).slice(0, 9).map((report) => (
              <article key={report.id || `${report.familyCode}-${report.createdAt}`} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                <div className="flex flex-wrap gap-2">
                  <Pill className={report.status === 'check_needed' ? 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]' : report.status === 'watch' ? 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]' : 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'}>
                    {report.status}
                  </Pill>
                  <Pill>{formatDate(report.createdAt)}</Pill>
                </div>

                <div className="mt-3 text-lg font-black">{report.parentName} · {report.familyCode || '-'}</div>

                <div className="mt-3 grid gap-2 text-xs font-black text-[#17443F] sm:grid-cols-3">
                  <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-[#D6EDE7]">점수 {report.score || 0}</div>
                  <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-[#D6EDE7]">품질 {report.quality || 0}</div>
                  <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-[#D6EDE7]">배터리 {report.battery || 0}%</div>
                </div>
              </article>
            ))}

            {!(data?.reports || []).length ? (
              <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
                아직 스마트링 리포트가 없습니다. CSV 업로드 후 다시 확인하세요.
              </div>
            ) : null}
          </div>
        </section>

        {editDevice ? (
          <section className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 px-4 py-4 backdrop-blur-sm sm:items-center">
            <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl ring-1 ring-[#D6EDE7]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Pill className={stageClass(editDevice.stage)}>{editDevice.stage}</Pill>
                  <h2 className="mt-3 text-3xl font-black tracking-[-0.07em]">
                    {editDevice.model} · {editDevice.familyCode || '미배정'}
                  </h2>
                </div>

                <button
                  onClick={() => setEditDevice(null)}
                  className="rounded-full bg-[#FAFFFD] px-4 py-2 text-sm font-black ring-1 ring-[#D6EDE7]"
                >
                  닫기
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-black text-[#637B76]">단계</span>
                  <select
                    value={editDevice.stage}
                    onChange={(event) => setEditDevice({ ...editDevice, stage: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                  >
                    {stages.map((stage) => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-black text-[#637B76]">상태</span>
                  <select
                    value={editDevice.status}
                    onChange={(event) => setEditDevice({ ...editDevice, status: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                  >
                    <option value="active">active</option>
                    <option value="paused">paused</option>
                    <option value="lost">lost</option>
                    <option value="returned">returned</option>
                    <option value="broken">broken</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-black text-[#637B76]">배터리 %</span>
                  <input
                    value={String(editDevice.batteryPct || '')}
                    onChange={(event) => setEditDevice({ ...editDevice, batteryPct: Number(event.target.value.replace(/[^\d]/g, '')) || 0 })}
                    className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-black text-[#637B76]">착용 평균 분</span>
                  <input
                    value={String(editDevice.wearMinutesAvg || '')}
                    onChange={(event) => setEditDevice({ ...editDevice, wearMinutesAvg: Number(event.target.value.replace(/[^\d]/g, '')) || 0 })}
                    className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-black text-[#637B76]">데이터 품질 점수</span>
                  <input
                    value={String(editDevice.dataQualityScore || '')}
                    onChange={(event) => setEditDevice({ ...editDevice, dataQualityScore: Number(event.target.value.replace(/[^\d]/g, '')) || 0 })}
                    className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-black text-[#637B76]">보호자 조회 수</span>
                  <input
                    value={String(editDevice.guardianViewCount || '')}
                    onChange={(event) => setEditDevice({ ...editDevice, guardianViewCount: Number(event.target.value.replace(/[^\d]/g, '')) || 0 })}
                    className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="text-sm font-black text-[#637B76]">이슈</span>
                  <input
                    value={editDevice.issue}
                    onChange={(event) => setEditDevice({ ...editDevice, issue: event.target.value.slice(0, 240) })}
                    className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="text-sm font-black text-[#637B76]">메모</span>
                  <textarea
                    value={editDevice.memo}
                    onChange={(event) => setEditDevice({ ...editDevice, memo: event.target.value.slice(0, 1200) })}
                    className="mt-2 min-h-[140px] w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-bold leading-7 outline-none"
                  />
                </label>
              </div>

              <button
                onClick={saveEdit}
                className="mt-5 w-full rounded-2xl bg-[#EFFFFA] px-5 py-5 text-base font-black text-[#247A71] ring-1 ring-[#CDEFE7]"
              >
                수정 저장
              </button>
            </div>
          </section>
        ) : null}
      </section>
    </main>
  )
}

export default AdminRingPilotDashboardPanel
