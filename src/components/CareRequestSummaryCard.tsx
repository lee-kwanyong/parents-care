type AnyRow = Record<string, any>

function listFrom(value: unknown) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }
  return []
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function labelRequestType(type: string) {
  const map: Record<string, string> = {
    hospital_visit: '병원 안심동행',
    medication_check: '약·복약 확인',
    meal_check: '식사 확인',
    discharge_care: '퇴원 후 안심케어',
    document_help: '서류 챙김',
    hospital: '병원 안심동행',
    medication: '약·복약 확인',
    meal: '식사 확인',
    discharge: '퇴원 후 안심케어',
    documents: '서류 챙김',
    routine: '정기진료 관리',
    social: '복지·지원 확인',
    not_sure: '운영실 상담 필요'
  }

  return map[type] || type || '안심케어 요청'
}

export function CareRequestSummaryCard({
  request,
  intake,
  offer,
  assignment,
  compact = false
}: {
  request?: AnyRow | null
  intake?: AnyRow | null
  offer?: AnyRow | null
  assignment?: AnyRow | null
  compact?: boolean
}) {
  const snapshot = offer?.request_snapshot || request || intake || assignment || {}
  const title = firstText(
    snapshot.request_title,
    snapshot.summary_title,
    assignment?.title,
    intake?.summary_title,
    '안심케어 요청 요약'
  )
  const elderName = firstText(snapshot.elder_name, intake?.elder_name, assignment?.elder_name, '부모님')
  const guardianName = firstText(snapshot.guardian_name, intake?.contact_name, snapshot.contact_name)
  const guardianPhone = firstText(snapshot.guardian_phone, intake?.contact_phone, snapshot.contact_phone)
  const region = firstText(snapshot.region_text, intake?.region_text, '지역 확인 필요')
  const place = firstText(snapshot.hospital_name, snapshot.meeting_location, assignment?.meeting_location, '장소 협의')
  const appointment = [snapshot.appointment_date, snapshot.appointment_time].filter(Boolean).join(' ') || firstText(assignment?.appointment_time, '일정 협의')
  const requestType = labelRequestType(firstText(snapshot.request_type, intake?.worry_type, snapshot.category))
  const specialties = listFrom(snapshot.required_specialties)
  const scopes = listFrom(snapshot.required_service_scopes)
  const rawText = firstText(snapshot.raw_text, intake?.raw_text, snapshot.memo, assignment?.safety_notes?.join?.(', '))

  return (
    <article
      className={
        'rounded-[1.6rem] border border-[#DCEEEA] bg-white shadow-[0_12px_34px_rgba(93,139,131,0.08)] ' +
        (compact ? 'p-4' : 'p-5 md:p-6')
      }
    >
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-[#EAFBF6] px-3 py-1 text-xs font-black text-[#2F756B] ring-1 ring-[#CBEAE4]">
          요청 요약
        </span>
        <span className="rounded-full bg-[#F4FAF9] px-3 py-1 text-xs font-black text-[#5B7774] ring-1 ring-[#E2EFEC]">
          {requestType}
        </span>
      </div>

      <h3 className="mt-4 text-2xl font-black tracking-[-0.03em] text-[#24423F]">
        {title}
      </h3>

      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <Info label="부모님" value={elderName} />
        <Info label="지역" value={region} />
        <Info label="일정" value={appointment} />
        <Info label="장소" value={place} />
        <Info label="보호자" value={guardianName || '확인 필요'} />
        <Info label="연락처" value={guardianPhone || '확인 필요'} />
      </div>

      {(specialties.length || scopes.length) ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <TagBox title="필요 역량" items={specialties.length ? specialties : ['운영실 확인']} />
          <TagBox title="필요 업무" items={scopes.length ? scopes : ['상담 후 정리']} />
        </div>
      ) : null}

      {rawText ? (
        <div className="mt-4 rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#E3EFEC]">
          <div className="text-xs font-black text-[#718A87]">상황 메모</div>
          <p className="mt-2 whitespace-pre-line text-sm font-bold leading-6 text-[#607D79]">
            {rawText}
          </p>
        </div>
      ) : null}
    </article>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#E3EFEC]">
      <div className="text-xs font-black text-[#718A87]">{label}</div>
      <div className="mt-1 text-sm font-black text-[#24423F]">{value}</div>
    </div>
  )
}

function TagBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#E3EFEC]">
      <div className="text-xs font-black text-[#718A87]">{title}</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.slice(0, 6).map((item) => (
          <span key={item} className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-[#4E6D69] ring-1 ring-[#E3EFEC]">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
