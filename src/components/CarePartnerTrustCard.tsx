import Link from 'next/link'

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

function bool(value: unknown) {
  return value === true || value === 'true' || value === 1
}

function stars(value: unknown) {
  const rating = Math.max(0, Math.min(5, Number(value || 0)))
  if (!rating) return '신규'
  return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating))
}

export function CarePartnerTrustCard({
  manager,
  offer,
  compact = false,
  showActions = false
}: {
  manager?: AnyRow | null
  offer?: AnyRow | null
  compact?: boolean
  showActions?: boolean
}) {
  const snapshot = offer?.manager_snapshot || {}
  const profile = manager || snapshot || {}
  const managerProfileId = firstText(offer?.manager_profile_id, profile.id, profile.manager_profile_id)
  const name = firstText(offer?.manager_name, profile.manager_name, profile.name) || '케어파트너'
  const phone = firstText(offer?.manager_phone, profile.manager_phone, profile.phone)
  const trustLevel = firstText(profile.trust_level, snapshot.trust_level) || 'standard'
  const identityVerified = bool(profile.identity_verified ?? snapshot.identity_verified)
  const regions = listFrom(profile.available_regions || snapshot.available_regions)
  const specialties = listFrom(profile.specialties || snapshot.specialties)
  const scopes = listFrom(profile.service_scopes || snapshot.service_scopes)
  const reasons = listFrom(offer?.offer_reasons)
  const trustSummary = firstText(
    profile.trust_card_summary,
    snapshot.trust_card_summary,
    profile.review_summary,
    '검증 절차를 거친 케어파트너입니다.'
  )
  const ratingText = stars(profile.avg_rating || profile.rating || profile.review_rating)

  return (
    <article
      className={
        'rounded-[1.6rem] border border-[#DCEEEA] bg-white shadow-[0_12px_34px_rgba(93,139,131,0.08)] ' +
        (compact ? 'p-4' : 'p-5 md:p-6')
      }
    >
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-[#EAFBF6] px-3 py-1 text-xs font-black text-[#2F756B] ring-1 ring-[#CBEAE4]">
          {identityVerified ? '본인확인 완료' : '검증 확인 필요'}
        </span>
        <span className="rounded-full bg-[#F4FAF9] px-3 py-1 text-xs font-black text-[#5B7774] ring-1 ring-[#E2EFEC]">
          {trustLevel === 'premium' ? '프리미엄' : '표준 신뢰'}
        </span>
        <span className="rounded-full bg-[#FFF7E8] px-3 py-1 text-xs font-black text-[#8A6C35] ring-1 ring-[#F0E0C4]">
          {ratingText}
        </span>
      </div>

      <div className="mt-4 flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#DCF8F1] text-3xl">
          🧑‍⚕️
        </div>

        <div className="min-w-0">
          <h3 className="text-2xl font-black tracking-[-0.03em] text-[#24423F]">
            {name}
          </h3>
          <p className="mt-1 text-sm font-bold leading-6 text-[#607D79]">
            {trustSummary}
          </p>
          {phone ? (
            <p className="mt-1 text-xs font-bold text-[#8AA29E]">
              연락처 {phone}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <InfoBlock title="활동 지역" items={regions.length ? regions : ['지역 협의']} />
        <InfoBlock title="가능 업무" items={scopes.length ? scopes.slice(0, 4) : ['병원동행', '약국동행', '귀가 확인']} />
        <InfoBlock title="전문 분야" items={specialties.length ? specialties.slice(0, 4) : ['어르신 응대', '복약 확인']} />
      </div>

      {reasons.length ? (
        <div className="mt-4 rounded-2xl bg-[#F6FCFA] p-4 ring-1 ring-[#E3EFEC]">
          <div className="text-sm font-black text-[#4E6D69]">추천 이유</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {reasons.map((reason) => (
              <span
                key={reason}
                className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#5B7774] ring-1 ring-[#E2EFEC]"
              >
                {reason}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl bg-[#FFF9EF] p-4 text-xs font-bold leading-5 text-[#6F5B31] ring-1 ring-[#F0E0C4]">
        의료행위, 처방 변경, 복약 지시는 제공하지 않습니다. 응급상황은 119 또는 의료기관이 우선입니다.
      </div>

      {showActions ? (
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {managerProfileId ? (
            <Link
              href={`/manager?managerProfileId=${encodeURIComponent(managerProfileId)}`}
              className="rounded-2xl bg-[#247A71] px-4 py-3 text-center text-sm font-black text-white"
            >
              케어파트너 화면 열기
            </Link>
          ) : null}
          <Link
            href="/admin/ops/matching"
            className="rounded-2xl bg-[#EAFBF6] px-4 py-3 text-center text-sm font-black text-[#2F756B] ring-1 ring-[#CBEAE4]"
          >
            매칭관리로 이동
          </Link>
        </div>
      ) : null}
    </article>
  )
}

function InfoBlock({
  title,
  items
}: {
  title: string
  items: string[]
}) {
  return (
    <div className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#E3EFEC]">
      <div className="text-xs font-black text-[#718A87]">{title}</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.slice(0, 4).map((item) => (
          <span key={item} className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-[#4E6D69] ring-1 ring-[#E3EFEC]">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
